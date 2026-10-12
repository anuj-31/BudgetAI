package in.anuj.moneymanager.repository;

import in.anuj.moneymanager.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<CategoryEntity,Long> {
    //select * from tbl_categories where profile_id = ?1
    List<CategoryEntity> findByProfileId(Long profileId);

    //select * from tbl_categories where id = ?1 and profile_id = ?2
    Optional<CategoryEntity> findByIdAndProfileId(Long id, Long profileId);
    //
//    //select * from tbl_categories where type = ?1 and profile_id = ?2
    List<CategoryEntity> findByTypeAndProfileId(String type, Long profileId);
    //  this will check the like bills category is present or not we dont create bills bills bills category like that too much
    Boolean existsByNameAndProfileId(String name, Long profileId);
}
