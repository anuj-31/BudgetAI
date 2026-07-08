package in.anuj.moneymanager.repository;

import in.anuj.moneymanager.entity.ProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository <ProfileEntity,Long>{

    Optional<ProfileEntity>findByEmail(String email);
    Optional<ProfileEntity> findFirstByEmailOrderByIdDesc(String email);
    boolean existsByEmail(String email);
    Optional<ProfileEntity>findByActivationToken(String activationToken);
}
